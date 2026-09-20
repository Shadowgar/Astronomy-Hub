/* Test binding for the real SWE EPHE reader. No Python-side decoding here. */
#include "swe.h"
#include <inttypes.h>

/* Logging is the only application service used by eph-file.c. */
void dolog(int level, const char *msg, const char *func,
           const char *file, int line, ...)
{
    fprintf(stderr, "native reader: %s (%s:%d)\n", msg, file, line);
}

static void number(const char *name, double value)
{
    printf("\"%s\":", name);
    if (isfinite(value)) printf("%.17g", value);
    else printf("null");
}

static int read_stars(const char type[4], const void *data, int size,
                      const json_value *json, void *user)
{
    int offset = 0, version, order, pix, row_size, flags, count, row;
    double vmag, gmag, ra, de, plx, pra, pde, epoch, bv;
    uint64_t gaia;
    int hip;
    char otype[4], ids[256], spectrum[32];
    void *table;
    eph_table_column_t columns[] = {
        {"type", 's', .size=4}, {"gaia", 'Q'}, {"hip", 'i'},
        {"vmag", 'f', EPH_VMAG}, {"gmag", 'f', EPH_VMAG},
        {"ra", 'f', EPH_RAD}, {"de", 'f', EPH_RAD},
        {"plx", 'f', EPH_ARCSEC}, {"pra", 'f', EPH_RAD_PER_YEAR},
        {"pde", 'f', EPH_RAD_PER_YEAR}, {"epoc", 'f', EPH_YEAR},
        {"bv", 'f'}, {"ids", 's', .size=256}, {"spec", 's', .size=32},
    };
    if (memcmp(type, "STAR", 4)) return 0;
    eph_read_tile_header(data, size, &offset, &version, &order, &pix);
    count = eph_read_table_header(version, data, size, &offset,
            &row_size, &flags, ARRAY_SIZE(columns), columns);
    if (count < 0) return -1;
    table = eph_read_compressed_block(data, size, &offset, &size);
    if (!table) return -1;
    offset = 0;
    for (row = 0; row < count; row++) {
        eph_read_table_row(table, size, &offset, ARRAY_SIZE(columns), columns,
                otype, &gaia, &hip, &vmag, &gmag, &ra, &de, &plx, &pra,
                &pde, &epoch, &bv, ids, spectrum);
        printf("{\"gaia\":\"%" PRIu64 "\",\"hip\":%d,", gaia, hip);
        number("vmag", vmag); printf(","); number("gmag", gmag);
        printf(","); number("render_magnitude", isnan(vmag) ? gmag : vmag);
        printf(","); number("ra", ra); printf(","); number("de", de);
        printf(","); number("plx", plx); printf(","); number("pra", pra);
        printf(","); number("pde", pde); printf(","); number("epoch", epoch);
        printf(","); number("bv", bv);
        printf(",\"spectrum\":\"%s\",\"ids\":\"%s\"}\n", spectrum, ids);
    }
    free(table);
    return 0;
}

int main(int argc, char **argv)
{
    FILE *file;
    long size;
    void *data;
    int result;
    if (argc != 2 || !(file = fopen(argv[1], "rb"))) return 2;
    fseek(file, 0, SEEK_END); size = ftell(file); rewind(file);
    data = malloc(size);
    if (fread(data, 1, size, file) != (size_t)size) return 2;
    fclose(file);
    result = eph_load(data, size, NULL, read_stars);
    free(data);
    return result != 0;
}
